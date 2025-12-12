import { QRCodeCanvas } from 'qrcode.react';

interface QrCodeGeneratorProps {
    value: string;
    size?: number;
}

export const QrCodeGenerator = ({ value, size = 128 }: QrCodeGeneratorProps) => {
    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 inline-block">
            <QRCodeCanvas value={value} size={size} level="H" />
        </div>
    );
};
