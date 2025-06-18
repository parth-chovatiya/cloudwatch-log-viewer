// app/page.tsx
import CloudWatchLogViewer from "./components/CloudWatchLogViewer";

export default function Home() {
  return (
    <main>
      <CloudWatchLogViewer />
    </main>
  );
}
