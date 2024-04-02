const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { lookup } = require("mime-types");
const { config } = require("dotenv");
const archiever = require("archiver")
const unzipper = require("unzipper");

config();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_S3_REGION,
});

const zipFolder = async(srcFilePath , outputFilePath) =>{

  try{
    const outputFile = fs.createWriteStream(outputFilePath);
    const archieve = archiever("zip" , {
      zlib:{
        level:9
      }
    });

    outputFile.on("close",()=>console.log("Archieve has been completed"));
    archieve.pipe(outputFile);
    archieve.directory(srcFilePath,false);
    archieve.finalize();
    archieve.on("error",(err)=>console.log(err))

  }catch(err) {
    console.log(err)
}
}


// const unzippedFile = fs.createReadStream(path.join(__dirname , "output", "compressed.zip")).pipe(unzipper.Extract({path:path.join(__dirname , "output" , "unzipped")}))


const init = async() => {
  //  const outDirPath = path.join(__dirname , "output");
  //  const build = exec(`cd ${outDirPath} && npm install && npm run build` );

  //  build.stdout.on("error",(err)=>console.log(err))
  //  build.stdout.on("data",(data)=>console.log(data))
  //  build.on("close",()=>{
  //     console.log("Build Complete")
  //  })

  const distFolderPath = path.join(__dirname, "output", "dist");
  await zipFolder(distFolderPath , path.join(__dirname , "output" , "compressed.zip"));
  
  const folders = fs.readdirSync(distFolderPath, { recursive: true });

  for (const file of folders) {
    const filePath = path.join(distFolderPath, file);
    if (fs.lstatSync(filePath).isDirectory()) continue;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `ouput/compressed.zip`,
      Body: fs.createReadStream(path.join(__dirname , "output" ,"compressed.zip")),
      ContentType: lookup(path.join(__dirname , "output" ,"compressed.zip")),
    });

   
     
    const upload = await s3Client.send(command)
    console.log(`${filePath.split("dist/")[1]} file uploaded`)

    
    
  }

};
init();
