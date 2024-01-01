function doFormatChat(text: string): string {
    let parts = text.split('"');
    parts = parts.map((part, index) => {
        part = part.trim().split('*').join('');
        if(index % 2 == 1) return `"${part}"`;
        else if (part.length > 0) return `*${part}*`;
        else return "";
    }).filter((part) => part.length > 0);
    return parts.join(" ");
}

export function formatChat(text: string): string {
    let paragraphs = text.split("\n\n");
    return paragraphs.map(doFormatChat).join("\n\n");
}