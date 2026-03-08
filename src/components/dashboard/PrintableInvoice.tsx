"use client";

import React from "react";
import { OrderItemDetail } from "./OrderDetail";

type PrintableInvoiceProps = {
    order: {
        id: string;
        totalAmount: number;
        buyerName: string | null;
        branchName?: string | null;
        tierName?: string;
        createdAt?: Date | string | number | null;
        items: OrderItemDetail[];
    };
    paperSize: 'full' | 'half' | 'large';
};

export default function PrintableInvoice({ order, paperSize }: PrintableInvoiceProps) {
    const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID").format(amount);
    };

    return (
        <div className={`invoice-print-area paper-size-${paperSize}`}>
            <div className="invoice-container">
                <div className="invoice-header">
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>ShoshaMart</h1>
                        <p style={{ margin: 0, fontSize: '10px' }}>
                            Jl. Pahlawan No.33, RT.10/RW.4{"\n"}
                            Sukabumi Selatan, Kec. Kb. Jeruk,{"\n"}
                            Kota Jakarta Barat, DKI Jakarta 11560
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>INVOICE</h2>
                        <p style={{ margin: 0, fontSize: '10px' }}>No: {order.id.slice(0, 8).toUpperCase()}</p>
                        <p style={{ margin: 0, fontSize: '10px' }}>Tgl: {dateStr}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                    <p style={{ margin: 0 }}><strong>Kepada Yth:</strong> {order.buyerName || "-"}</p>
                    {order.branchName && <p style={{ margin: 0 }}><strong>Cabang:</strong> {order.branchName}</p>}
                </div>

                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>Nama Barang (SKU)</th>
                            <th style={{ textAlign: 'center' }}>Harga/Satuan</th>
                            <th style={{ textAlign: 'center' }}>Qty</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div>{item.name}</div>
                                    <div style={{ fontSize: '8px', color: '#666' }}>{item.sku}</div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {formatCurrency(item.price)}/{item.unit || "Pcs"}
                                </td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="invoice-total-section">
                    <div className="invoice-total-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>TOTAL BAYAR</span>
                            <span>Rp {formatCurrency(order.totalAmount)}</span>
                        </div>
                        <p style={{ marginTop: '5px', fontSize: '9px', fontStyle: 'italic' }}>
                            Terbilang: # {order.totalAmount.toLocaleString('id-ID')} Rupiah #
                        </p>
                    </div>
                </div>

                <div className="invoice-signatures">
                    <div className="signature-box">
                        <p>Penerima,</p>
                        <div className="signature-line" style={{ marginTop: '20px' }}></div>
                        <p>( _________________ )</p>
                    </div>
                    <div className="signature-box">
                        <p>Hormat Kami,</p>
                        <div className="signature-line" style={{ marginTop: '20px' }}></div>
                        <p>ShoshaMart</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
