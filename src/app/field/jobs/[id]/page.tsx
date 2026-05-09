export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4">
      <h1 className="font-display text-2xl font-bold">Job {id}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Unified job sheet built in WO-P2-2D.
      </p>
    </div>
  );
}
