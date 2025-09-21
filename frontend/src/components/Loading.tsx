import { Spinner } from "./ui/shadcn-io/spinner"
interface LoadingPageProps {
  message?: string
}

export function LoadingPage({
  message = "Loading...",
}: LoadingPageProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="p-6">
        <div className="flex flex-col justify-center items-center min-h-96 gap-4">
          <Spinner variant="ring" />
          <div className="text-muted-foreground">{message}</div>
        </div>
      </main>
    </div>
  )
}