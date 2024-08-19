import DirectoryFlattener from '../components/DirectoryFlattener';

export default function Home() {
  return (
    <div className="min-h-screen ">
      <main className="container mx-auto py-8">
        <DirectoryFlattener />
      </main>
    </div>
  );
}