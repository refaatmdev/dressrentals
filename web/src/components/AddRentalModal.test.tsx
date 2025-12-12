import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddRentalModal } from './AddRentalModal';
import { clientService } from '../services/clientService';
import { dressService } from '../services/dressService';
import { rentalService } from '../services/rentalService';

// Mock services
vi.mock('../services/clientService');
vi.mock('../services/dressService');
vi.mock('../services/rentalService');

describe('AddRentalModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock returns
        (clientService.getAllClients as any).mockResolvedValue([]);
        (dressService.getAllDresses as any).mockResolvedValue([]);
        (rentalService.getRentalsByDress as any).mockResolvedValue([]);
    });

    it('should not render when isOpen is false', () => {
        render(
            <AddRentalModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        expect(screen.queryByText('הוספת השכרה חדשה')).not.toBeInTheDocument();
    });

    it('should render correctly when open', async () => {
        render(
            <AddRentalModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        expect(screen.getByText('הוספת השכרה חדשה')).toBeInTheDocument();
        // Should start at step 1 (Client)
        expect(screen.getByPlaceholderText('חפש לקוח לפי שם או טלפון...')).toBeInTheDocument();
    });

    it('should allow navigating to new client form', async () => {
        render(
            <AddRentalModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const newClientBtn = screen.getByText('+ יצירת לקוח חדש');
        fireEvent.click(newClientBtn);

        expect(screen.getByText('פרטי לקוח חדש')).toBeInTheDocument();
        expect(screen.getByText('שם מלא')).toBeInTheDocument();
    });

    it('should disable "Next" button if no client selected', async () => {
        render(
            <AddRentalModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const nextBtn = screen.getByText('המשך לשלב הבא');
        expect(nextBtn).toBeDisabled();
    });
});
