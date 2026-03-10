export const dynamic = "force-dynamic";

export default function VersionPage() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const commitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE || null;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;
  const env = process.env.VERCEL_ENV || null;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Version</h1>
      <div className="mt-4 rounded-lg border bg-white p-4 text-sm">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <span className="font-medium">vercel_env:</span> {env ?? "-"}
          </div>
          <div>
            <span className="font-medium">deployment_id:</span> {deploymentId ?? "-"}
          </div>
          <div>
            <span className="font-medium">git_commit_sha:</span> {commitSha ?? "-"}
          </div>
          <div>
            <span className="font-medium">git_commit_message:</span> {commitMsg ?? "-"}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-600">
        Se questo valore non cambia dopo un deploy, stai vedendo una build vecchia o un dominio che punta a un deploy diverso.
      </p>
    </div>
  );
}
