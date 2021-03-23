'use strict';

const async = require('async');
const fs = require('fs');
const https = require('https');
const path = require("path");
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);
const regex= new RegExp(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/);
//var expression = /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~@:%]*)*(#[\w\-]*)?(\?[^\s]*)?/;
//const regex= new RegExp(expression);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

/**
 * AUTHENTICATE
 * This single client is used for all examples.
 */

let urlList=[];
let nonUrlList=[];

const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);

function printRecText(readResults) {
    console.log('Recognized text:');
    for (const page in readResults) {
      if (readResults.length > 1) {
        console.log(`==== Page: ${page}`);
      }
      const result = readResults[page];
      if (result.lines.length) {
        for (const line of result.lines) {
          console.log(line.words.map(w => w.text).join(' '));
        }
      }
      else { console.log('No recognized text.'); }
    }
  }



    function computerVision() {
        async.series([
          async function () {
        const printedTextSampleURL = 'https://moderatorsampleimages.blob.core.windows.net/samples/sample2.jpg';
        const multiLingualTextURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/MultiLingual.png';
        //const handwrittenTextURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/MultiPageHandwrittenForm.pdf'; 
        const handwrittenTextURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/handwritten_text.jpg';

        const STATUS_SUCCEEDED = "succeeded";
        const STATUS_FAILED = "failed";

        const handwrittenImagePath = __dirname + '\\url.jpg';
   /*    try {
        await downloadFilesToLocal(handwrittenTextURL, handwrittenImagePath);
      } catch {
        console.log('>>> Download sample file failed. Sample cannot continue');
        process.exit(1);
      } */
      console.log('\Reading local image for text in ...', path.basename(handwrittenImagePath));
      
      const streamResponse = await computerVisionClient.readInStream(() => createReadStream(handwrittenImagePath))
        .then((response) => {
          return response;
        });
        console.log();
        // Get operation location from response, so you can get the operation ID.
        const operationLocationLocal = streamResponse.operationLocation
        // Get the operation ID at the end of the URL
        const operationIdLocal = operationLocationLocal.substring(operationLocationLocal.lastIndexOf('/') + 1);
  
        // Wait for the read operation to finish, use the operationId to get the result.
        while (true) {
          const readOpResult = await computerVisionClient.getReadResult(operationIdLocal)
            .then((result) => {
              return result;
            })
          console.log('Read status: ' + readOpResult.status)
          if (readOpResult.status === STATUS_FAILED) {
            console.log('The Read File operation has failed.')
            break;
          }
          if (readOpResult.status === STATUS_SUCCEEDED) {
            console.log('The Read File operation was a success.');
            console.log();
            console.log('Read File local image result:');
            for (const textRecResult of readOpResult.analyzeResult.readResults) {
              for (const line of textRecResult.lines) {
                if(regex.test(line.text))
                {
                    urlList.push(line.text);
                }
                else{
                    nonUrlList.push(line.text);
                }
              }
            }
            console.log("Urls in the text");
            urlList.forEach(function(entry)
            {
                console.log(entry);
            }
            )
            console.log("\n");
            console.log("Text in the images");
            nonUrlList.forEach(function(entry)
            {
            console.log(entry);
            }
            )
            break;
          }
          await sleep(1000);
        }
        console.log();
    },
        function () {
          return new Promise((resolve) => {
            resolve();
          })
        }
      ], (err) => {
        throw (err);
      });
    }
    
    computerVision();
