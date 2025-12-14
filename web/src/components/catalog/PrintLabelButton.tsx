import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { DressLabel } from './DressLabel';

interface PrintLabelButtonProps {
    dressId: string;
    dressName: string;
}

export const PrintLabelButton = ({ dressId, dressName }: PrintLabelButtonProps) => {
    const componentRef = useRef<HTMLDivElement>(null);

    // Custom print handler to pass the specific content getter
    const triggerPrint = useReactToPrint({
        contentRef: componentRef,
        // @page directive is critical for thermal printers to avoid feeding blank paper
        pageStyle: `
        @page {
          size: 50mm 20mm;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `,
    });

    return (
        <>
            <div style={{ display: 'none' }}>
                <DressLabel ref={componentRef} dressId={dressId} dressName={dressName} />
            </div>
            <button
                onClick={() => triggerPrint()}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded transition-colors flex items-center gap-2"
                title="Print Label"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print Label
            </button>
        </>
    );
};
