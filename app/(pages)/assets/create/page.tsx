// app/page.tsx
import NewAssetForm from '@/components/assets/AddDomainForm';
export default function CreatePage() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Section for adding a new domain */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Add New Domain
        </h1>
        <p className="text-muted-foreground mb-6">
          Fill out the form below to add a new asset to your tracker.
        </p>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <NewAssetForm />
        </div>
      </section>
    </main>
  );
}