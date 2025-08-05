import * as vercel from "@vercel/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";

// Vercel Project
const project = new vercel.Project("learning-accelerator", {
    name: "learning-accelerator",
    framework: "nextjs",
    environmentVariables: [
        {
            key: "NEXT_PUBLIC_SUPABASE_URL",
            value: process.env.SUPABASE_URL!,
            targets: ["production", "preview"],
        },
        {
            key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
            value: process.env.SUPABASE_ANON_KEY!,
            targets: ["production", "preview"],
        },
    ],
});

// S3 Backup Bucket
const backupBucket = new aws.s3.Bucket("la-backups", {
    versioning: { enabled: true },
    lifecycleRules: [{
        enabled: true,
        expiration: { days: 30 },
    }],
});

// Cloudflare DNS
const appRecord = new cloudflare.Record("app-dns", {
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
    name: "app",
    value: project.domains[0],
    type: "CNAME",
    proxied: true,
});

const apiRecord = new cloudflare.Record("api-dns", {
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
    name: "api", 
    value: "learning-accelerator-api.fly.dev",
    type: "CNAME",
    proxied: true,
});

export const vercelUrl = project.domains[0];
export const s3BucketArn = backupBucket.arn;
export const flyAppUrl = "https://learning-accelerator-api.fly.dev";