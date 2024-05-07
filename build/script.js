const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { lookup } = require("mime-types");
const { config } = require("dotenv");

config();

const PROJECT_ID = process.env.PROJECT_ID;
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_S3_REGION,
});

const init = async () => {
  const outDirPath = path.join(__dirname, "output");
  const build = exec(`cd ${outDirPath} && npm install && npm run build`);

  build.stdout.on("error", (err) => console.log(err));
  build.stdout.on("data", (data) => console.log(data));
  build.on("close", async () => {
    const distFolderPath = path.join(__dirname, "output", "dist");

    const folders = fs.readdirSync(distFolderPath, { recursive: true });

    for (const file of folders) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: lookup(filePath),
      });

      await s3Client.send(command);
    }
    console.log("Build Complete");
  });
};
init();
