const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();
var lambda = new AWS.Lambda();

class AWSUtility {
  static triggerLambda(lambdaName, payload) {
    var params = {
      FunctionName: lambdaName,
      Payload: JSON.stringify(payload),
    };

    return new Promise((resolve, reject) => {
      lambda.invoke(params, function (err, data) {
        if (err) {
          console.log(err, err.stack, data);
          reject(err);
        } else {
          console.log('successfully invoked ' + lambdaName);
          resolve();
        }
      });
    });
  }

  static saveObjectToS3(bucket, key, obj, contentType) {
    var buf = Buffer.from(contentType ? obj : JSON.stringify(obj));
    var data = {
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentEncoding: contentType ? 'utf8' : 'base64',
      ContentType: contentType || 'application/json',
    };

    return new Promise((resolve, reject) => {
      s3.upload(data, function (err, data) {
        if (err) {
          console.log(err);
          console.log(`Error uploading data to ${bucket}/${key}`, data);
          reject(err);
        } else {
          console.log(`Successfully uploaded ${bucket}/${key}`);
          resolve();
        }
      });
    });
  }

  static saveStreamToS3(bucket, key, stream, contentType) {
    const data = {
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentEncoding: 'utf8',
      ContentType: contentType,
    };

    return new Promise((resolve, reject) => {
      s3.upload(data, function (err, data) {
        if (err) {
          console.log(err);
          console.log(`Error uploading data to ${bucket}/${key}`, data);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = AWSUtility;
