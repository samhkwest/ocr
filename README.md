This is a backend built by NodeJs with following functions:

1.  When a file is uploaded to the Cloud Storage bucket "captured-image", the exported functions "processImage" is 
    triggered to detect characters in the uploaded image file.
2.  The extracted text is sent to a Cloud Pub/Sub queue for saving result.
3.  The Google cloud function automatically gets the extracted result from the queue and call exported function "saveResult"
    to save the extracted text into a file and place it in the Cloud Storage bucket "processed-image"
