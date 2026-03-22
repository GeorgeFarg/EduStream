
const Badge = ({ text, badgeColor }: { text: string, badgeColor: string }) => {
    return (
        <span className={`inline-flex items-center px-2 py-1 ring-1 ring-inset text-sm font-medium rounded ${badgeColor}`
        }> {text}</span >

    )
}

export default Badge