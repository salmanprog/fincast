/** Skip Recharts SVG — inlining fill/stroke there breaks axis scaling in html2canvas. */
function isInsideRecharts(node: Element): boolean {
  return Boolean(node.closest('.recharts-wrapper, .recharts-surface'));
}

/** Inline resolved rgb colors so html2canvas does not parse Tailwind oklab/oklch in stylesheets. */
function inlineResolvedColors(root: HTMLElement) {
  const view = root.ownerDocument?.defaultView;
  if (!view) return;

  const nodes: Element[] = [root, ...root.querySelectorAll('*')];
  for (const node of nodes) {
    if (isInsideRecharts(node)) continue;

    const cs = view.getComputedStyle(node);

    if (node instanceof HTMLElement) {
      node.style.color = cs.color;
      node.style.backgroundColor = cs.backgroundColor;
      node.style.borderColor = cs.borderColor;
      node.style.borderTopColor = cs.borderTopColor;
      node.style.borderRightColor = cs.borderRightColor;
      node.style.borderBottomColor = cs.borderBottomColor;
      node.style.borderLeftColor = cs.borderLeftColor;
      node.style.outlineColor = cs.outlineColor;
    }
  }
}

function prepareCloneForCapture(cloned: HTMLElement) {
  inlineResolvedColors(cloned);

  cloned.style.width = `${Math.max(cloned.scrollWidth, 920)}px`;
  cloned.style.backgroundColor = '#ffffff';

  cloned.querySelectorAll('.recharts-tooltip-wrapper').forEach((el) => {
    if (el instanceof HTMLElement) el.style.display = 'none';
  });

  const chart = cloned.querySelector('.forecast-depletion-chart');
  if (chart instanceof HTMLElement) {
    chart.style.overflow = 'visible';
  }
}

/** Wait until Recharts has painted the line path (export layout uses fixed size). */
export function waitForChartReady(root: HTMLElement, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const curve = root.querySelector('.recharts-line-curve, .recharts-curve');
      if (curve) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Renders a DOM node to a multi-page A4 PDF and triggers download. */
export async function downloadForecastPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Report element not found.');
  }

  await waitForChartReady(element);
  await new Promise((r) => setTimeout(r, 300));

  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: Math.max(element.scrollWidth, 920),
    onclone: (_doc, cloned) => {
      if (cloned instanceof HTMLElement) {
        prepareCloneForCapture(cloned);
      }
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
