import AvailabilityClient from "./AvailabilityClient"

export const dynamic = "force-dynamic"

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <div className="max-w-xl mx-auto">
      <AvailabilityClient token={token} />
    </div>
  )
}
