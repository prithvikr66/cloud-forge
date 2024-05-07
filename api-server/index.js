const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { config } = require("dotenv");

const app = express();
config();
app.use(express.json());

console.log(process.env.AWS_S3_BUCKET_NAME);
const ecsClient = new ECSClient({
  region: process.env.AWS_S3_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
});

const ecsConfig = {
  CLUSTER: process.env.AWS_ECS_CLUSTER_ARN,
  TASK: process.env.AWS_ECS_TASK_ARN,
};

app.post("/deploy", async (req, res) => {
  try {
    const { githubUrl } = req.body;
    const splittedUrls = githubUrl.split("/");
    const projectId = splittedUrls[splittedUrls.length - 1].split(".")[0];
    const runTaskCommand = new RunTaskCommand({
      cluster: ecsConfig.CLUSTER,
      taskDefinition: ecsConfig.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            "subnet-0298be0e66cb970bf",
            "subnet-02eff7055f8b4d437",
            "subnet-01847d17f85947778",
          ],
          assignPublicIp: "ENABLED",
          securityGroups: ["sg-04286e9c3a9e10478"],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "cloud-forge-build-service",
            environment: [
              {
                name: "AWS_ACCESS_KEY_ID",
                value: process.env.AWS_ACCESS_KEY_ID,
              },
              {
                name: "AWS_SECRET_ACCESS_KEY",
                value: process.env.AWS_SECRET_ACCESS_KEY,
              },
              { name: "AWS_S3_REGION", value: process.env.AWS_S3_REGION },
              {
                name: "AWS_S3_BUCKET_NAME",
                value: process.env.AWS_S3_BUCKET_NAME,
              },
              {
                name: "GIT_REPOSITORY__URL",
                value: githubUrl,
              },
              {
                name: "PROJECT_ID",
                value: projectId,
              },
            ],
          },
        ],
      },
    });
    await ecsClient.send(runTaskCommand);

    res.json({
      status: "queued",
      projectId,
      projectUrl: `${projectId}.localhost:8000`,
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen(9000, () => {
  console.log("Server running on port 9000");
});
