// app/assets/edit/[id]/page.tsx
import { notFound } from "next/navigation";
import AssetForm from "@/components/assets/AddDomainForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// It's good practice to instantiate Prisma Client once
import { db } from "@/lib/db";
import EditAssetForm from "@/components/assets/editDomainForm";
interface EditAssetPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Function to fetch a single asset
async function getAsset(id: string) {
  const asset = await db.asset.findUnique({
    where: { id },
  });
  return asset;
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const { id } = await params;
  const asset = await getAsset(id);

  if (!asset) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Asset</CardTitle>
          <CardDescription>
            Update the details for "{asset.name}".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditAssetForm asset={asset} />
        </CardContent>
      </Card>
    </div>
  );
}
