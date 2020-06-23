'use strict';

const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const Vision = require('@google-cloud/vision');
const vision = new Vision.ImageAnnotatorClient();

//const {Translate} = require('@google-cloud/translate').v2;
//const translate = new Translate();

const publishResult = async (topicName, data) => {
  const dataBuffer = Buffer.from(JSON.stringify(data));

  const [topic] = await pubsub.topic(topicName).get({autoCreate: true});
  topic.publish(dataBuffer);
};

const detectText = async (bucketName, filename) => {
    console.log(`Looking for text in image ${filename}`);
    const [textDetections] = await vision.textDetection(
        `gs://${bucketName}/${filename}`
    );
    const [annotation] = textDetections.textAnnotations;
    const text = annotation ? annotation.description : '';
    console.log(`Extracted text from image:`, text);
/*
    let [translateDetection] = await translate.detect(text);
    if (Array.isArray(translateDetection)) {
        [translateDetection] = translateDetection;
    }

    const lang = translateDetection.language;
    console.log(`Detected language "${lang}" for ${filename}`);
*/
    const topicName = process.env.RESULT_TOPIC;

    const messageData = {
      text: text,
      filename: filename,
      //lang: lang,
    };

    await publishResult(topicName, messageData);
};

const getResultFileName = (filename, postfix) => {
  return `${filename}_${postfix}.txt`;
};

exports.processImage = async (event) => {
  const {bucket, name} = event;
  await detectText(bucket, name);
  console.log(`File ${name} processed.`);
};

exports.saveResult = async (event) => {
  const pubsubData = event.data;
  const jsonStr = Buffer.from(pubsubData, 'base64').toString();
  //const {text, filename, lang} = JSON.parse(jsonStr);
  const {text, filename} = JSON.parse(jsonStr);

  console.log(`Save file ${filename}...`);
  const bucketName = process.env.RESULT_BUCKET;
  const newFilename = getResultFileName(filename, "result");
  const file = storage.bucket(bucketName).file(newFilename);
  console.log(`Saving result to ${newFilename} in bucket ${bucketName}...`);

  await file.save(text);
  console.log(`File saved.`);
};