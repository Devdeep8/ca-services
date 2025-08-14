import MyWorkPage from "./my-work-client";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <div>
        <MyWorkPage userId={userId} />
    </div>
  );
}
