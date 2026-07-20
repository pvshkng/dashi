function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function inline(text: string): string {
	return text
		.replaceAll(/`([^`]+)`/g, '<code>$1</code>')
		.replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replaceAll(/\*([^*]+)\*/g, '<em>$1</em>')
		.replaceAll(
			/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
			'<a href="$2" target="_blank" rel="noreferrer">$1</a>'
		);
}

/** Minimal markdown → HTML: headings, lists, code blocks, bold/italic/code/links. */
export function renderMarkdown(source: string): string {
	const escaped = escapeHtml(source);
	const lines = escaped.split('\n');
	const out: string[] = [];
	let inCode = false;
	let inList = false;

	function closeList() {
		if (inList) {
			out.push('</ul>');
			inList = false;
		}
	}

	for (const line of lines) {
		if (line.startsWith('```')) {
			closeList();
			out.push(inCode ? '</code></pre>' : '<pre><code>');
			inCode = !inCode;
			continue;
		}
		if (inCode) {
			out.push(line);
			continue;
		}
		const heading = line.match(/^(#{1,4})\s+(.*)$/);
		if (heading) {
			closeList();
			const level = heading[1].length;
			out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
			continue;
		}
		const item = line.match(/^\s*[-*]\s+(.*)$/);
		if (item) {
			if (!inList) {
				out.push('<ul>');
				inList = true;
			}
			out.push(`<li>${inline(item[1])}</li>`);
			continue;
		}
		closeList();
		if (line.trim() === '') continue;
		out.push(`<p>${inline(line)}</p>`);
	}
	closeList();
	if (inCode) out.push('</code></pre>');
	return out.join('\n');
}
