import os
import io
import re
import string
import numpy as np
import tensorflow as tf

AUTOTUNE = tf.data.AUTOTUNE

class word_to_vec:
    def training_data(self, sequences, window_size, num_ns, vocab_size, seed):
      targets, contexts, labels = [], [], []
      sampling_table = tf.keras.preprocessing.sequence.make_sampling_table(vocab_size)

      for sequence in sequences:
        positive_skip_grams, _ = tf.keras.preprocessing.sequence.skipgrams(
              sequence,
              vocabulary_size=vocab_size,
              sampling_table=sampling_table,
              window_size=window_size,
              negative_samples=0)

        for target_word, context_word in positive_skip_grams:
          context_class = tf.expand_dims(
              tf.constant([context_word], dtype="int64"), 1)
          negative_sampling_words, _, _ = tf.random.log_uniform_candidate_sampler(
              true_classes=context_class,
              num_true=1,
              num_sampled=num_ns,
              unique=True,
              range_max=vocab_size,
              seed=seed,
              name="negative_sampling")

          negative_sampling_words = tf.expand_dims(negative_sampling_words, 1)

          context = tf.concat([context_class, negative_sampling_words], 0)
          label = tf.constant([1] + [0]*num_ns, dtype="int64")

          targets.append(target_word)
          contexts.append(context)
          labels.append(label)

      return targets, contexts, labels
    
    def custom_standardization(self, input_data):
      lowercase = tf.strings.lower(input_data)
      return tf.strings.regex_replace(lowercase, '[%s]' % re.escape(string.punctuation), '')

    def __init__(self, filepaths = [], window_size = 3, num_ns = 4, dim = 300, sequence_length = 30, batch_size = 1024, buffer_size = 10000, max_tokens = 20000, seed = 40, download = {
            "download": True, "url": '', "filename": ''
        }, vectors_destination = None, epochs = 20):
        if download["download"] == True and len(str(download["filename"])) > 0 and len(str(download["url"])) > 0:
            path_to_file = tf.keras.utils.get_file(download["filename"], download["url"])
            filepaths.append(path_to_file)

        corpus_dataset = tf.data.TextLineDataset(filepaths).filter(lambda i: tf.cast(tf.strings.length(i), bool))
        vectorize_corpus = tf.keras.layers.TextVectorization(
            standardize = self.custom_standardization,
            max_tokens = max_tokens,
            output_mode = 'int',
            output_sequence_length = sequence_length
            )
        vectorize_corpus.adapt(corpus_dataset)
        corpus_vector_ds = corpus_dataset.batch(1024).prefetch(AUTOTUNE).map(vectorize_corpus).unbatch()
        vocabulary = vectorize_corpus.get_vocabulary()
        sequences = list(corpus_vector_ds.as_numpy_iterator())

        targets, contexts, labels = self.training_data(
                sequences = sequences,
                window_size = window_size,
                num_ns = num_ns,
                vocab_size = max_tokens,
                seed = seed
            )
        targets = np.array(targets)
        contexts = np.array(contexts)[:,:,0]
        labels = np.array(labels)

        dataset = tf.data.Dataset.from_tensor_slices(((targets, contexts), labels))
        dataset = dataset.shuffle(buffer_size).batch(batch_size, drop_remainder=False)
        dataset = dataset.cache().prefetch(buffer_size=AUTOTUNE)

        class Word2Vec(tf.keras.Model):
          def __init__(self, vocab_size, embedding_dim, num_ns):
            super(Word2Vec, self).__init__()
            self.target_embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim, input_length=1, name="w2v_embedding")
            self.context_embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim, input_length = num_ns+1)

          def call(self, pair):
            target, context = pair
            if len(target.shape) == 2:
              target = tf.squeeze(target, axis=1)
            word_emb = self.target_embedding(target)
            context_emb = self.context_embedding(context)
            dots = tf.einsum('be,bce->bc', word_emb, context_emb)
            return dots

        word2vec = Word2Vec(max_tokens, dim, num_ns)
        word2vec.compile(optimizer='adam', loss=tf.keras.losses.CategoricalCrossentropy(from_logits=True), metrics=['accuracy'])

        word2vec.fit(dataset, epochs=epochs)
        weights = word2vec.get_layer('w2v_embedding').get_weights()[0]

        if not vectors_destination == None:
            v_file = open(vectors_destination, mode = "w", encoding = "UTF-8")        
            for index, word in enumerate(vocabulary):
              if index == 0:
                continue
              vec = weights[index]
              v_file.write(word + '\t' + '\t'.join([str(x) for x in vec]) + "\n")
            v_file.close()    
        return None
