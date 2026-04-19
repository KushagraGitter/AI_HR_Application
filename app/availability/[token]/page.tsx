import AvailabilityClient from "./AvailabilityClient"

export const dynamic = "force-dynamic"

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <div className="mesh-bg min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-8">
        <AvailabilityClient token={token} />
      </div>
    </div>
  )
}
