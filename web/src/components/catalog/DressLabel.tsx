import { forwardRef } from 'react';
import QRCode from 'react-qr-code';

interface DressLabelProps {
    dressId: string;
    dressName: string;
}

export const DressLabel = forwardRef<HTMLDivElement, DressLabelProps>((props, ref) => {
    const { dressId, dressName } = props;

    return (
        <div
            ref={ref}
            style={{
                width: '50mm',
                height: '20mm',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '2mm',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                overflow: 'hidden',
            }}
        >
            {/* Left Side: QR Code */}
            <div style={{ flexShrink: 0, marginRight: '4mm' }}>
                <QRCode
                    value={dressId}
                    size={50} // Approx 13-14mm, fits well within 20mm height with padding
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 256 256`}
                />
            </div>

            {/* Right Side: Text Details */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                }}
            >
                <span
                    style={{
                        fontSize: '10pt',
                        fontWeight: 'bold',
                        color: 'black',
                        marginBottom: '2px', // Slight separation
                        lineHeight: 1.2,
                    }}
                >
                    {dressName.length > 15 ? dressName.substring(0, 15) + '.' : dressName}
                </span>
                <span
                    style={{
                        fontSize: '8pt',
                        fontFamily: 'monospace',
                        color: 'black',
                        lineHeight: 1,
                    }}
                >
                    {dressId}
                </span>
            </div>
        </div>
    );
});

DressLabel.displayName = 'DressLabel';
