/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";

// Register fonts if needed, for now we use standard
const PAPER_SIZES = {
    full: [684, 792], // 9.5 x 11 in
    half: [684, 396], // 9.5 x 5.5 in
    large: [1065.6, 792], // 14.8 x 11 in
};

// Register fonts if needed, for now we use standard
const styles = StyleSheet.create({
    page: {
        paddingVertical: 15, // Reduced vertical padding to save space
        paddingHorizontal: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#000",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 5, // Even tighter
        borderBottomWidth: 1,
        borderColor: "#000",
        paddingBottom: 3,
    },
    shopInfo: {
        width: "35%",
    },
    shopName: {
        fontSize: 14, // More compact
        fontWeight: "bold",
        marginBottom: 2,
    },
    shopAddress: {
        fontSize: 10,
        lineHeight: 1.1,
    },
    invoiceTitleContainer: {
        width: "30%",
        textAlign: "center",
        justifyContent: "center",
        paddingTop: 5,
    },
    invoiceTitle: {
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "uppercase",
        textDecoration: "underline",
    },
    invoiceInfo: {
        width: "35%",
        textAlign: "right",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 2,
    },
    infoLabel: {
        width: "40%",
        color: "#333",
        fontSize: 12,
    },
    infoValue: {
        width: "60%",
        fontWeight: "bold",
        fontSize: 12,
    },
    table: {
        marginTop: 5, // Reduced from 10
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000", // Black for Dot Matrix
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 3,
    },
    tableColHeaderSmall: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 3,
        textAlign: "center",
    },
    tableCell: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 3,
    },
    tableCellSmall: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 3,
        textAlign: "center",
    },
    tableCellRight: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 3,
        textAlign: "right",
    },
    footerSection: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end", // Align signatures to bottom with total
    },
    totalBox: {
        width: "35%",
        borderTopWidth: 1,
        borderColor: "#000",
        paddingTop: 3,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    totalLabel: {
        fontWeight: "bold",
        fontSize: 10,
    },
    totalValue: {
        fontWeight: "bold",
        fontSize: 11,
        color: "#000",
    },
    terbilang: {
        marginTop: 5,
        fontStyle: "italic",
        fontSize: 10,
        color: "#333",
    },
    signatureBox: {
        width: "25%",
        textAlign: "center",
        fontSize: 10,
    },
    signatureLabel: {
        marginBottom: 25, // Space for sign
    },
    signatureLine: {
        borderTopWidth: 1,
        borderColor: "#000",
        paddingTop: 2,
    }
});

import { OrderItemDetail } from "./OrderDetail";

type InvoiceProps = {
    order: {
        id: string;
        totalAmount: number;
        buyerName: string | null;
        branchName?: string | null;
        tierName?: string;
        createdAt?: Date | string | number | null;
        items: OrderItemDetail[];
    };
    paperSize?: 'full' | 'half' | 'large';
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
    }).format(amount);
};

export const InvoicePDF = ({ order, paperSize = 'full' }: InvoiceProps) => {
    const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

    const size = PAPER_SIZES[paperSize] as any;

    return (
        <Document>
            <Page size={size} style={styles.page}>
                {/* Header: 3 Columns */}
                <View style={styles.header}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>ShoshaMart</Text>
                        <Text style={styles.shopAddress}>
                            Jl. Pahlawan No.33, RT.10/RW.4{"\n"}
                            Sukabumi Selatan, Kec. Kb. Jeruk,{"\n"}
                            Kota Jakarta Barat, DKI Jakarta 11560
                        </Text>
                    </View>

                    <View style={styles.invoiceTitleContainer}>
                        <Text style={styles.invoiceTitle}>Invoice</Text>
                    </View>

                    <View style={styles.invoiceInfo}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>No. Trx: </Text>
                            <Text style={styles.infoValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal: </Text>
                            <Text style={styles.infoValue}>{dateStr}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Kepada: </Text>
                            <Text style={styles.infoValue}>{order.buyerName || "-"}</Text>
                        </View>
                        {order.branchName && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Cabang: </Text>
                                <Text style={styles.infoValue}>{order.branchName}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableColHeader}><Text>Nama Barang (SKU)</Text></View>
                        <View style={styles.tableColHeaderSmall}><Text>Harga/Satuan</Text></View>
                        <View style={styles.tableColHeaderSmall}><Text>Qty</Text></View>
                        <View style={styles.tableColHeaderSmall}><Text>Subtotal</Text></View>
                    </View>

                    {order.items.map((item, index) => (
                        <View style={styles.tableRow} key={item.id} wrap={false}>
                            <View style={styles.tableCell}>
                                <Text>{item.name}</Text>
                                <Text style={{ fontSize: 10, color: "#333" }}>{item.sku}</Text>
                            </View>
                            <View style={styles.tableCellSmall}>
                                <Text>{formatCurrency(item.price)}</Text>
                                <Text style={{ fontSize: 10 }}>/{item.unit || "Pcs"}</Text>
                            </View>
                            <View style={styles.tableCellSmall}><Text>{item.quantity}</Text></View>
                            <View style={styles.tableCellRight}><Text>{formatCurrency(item.price * item.quantity)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Footer: Signatures + Total in One Row */}
                <View style={styles.footerSection} wrap={false}>
                    {/* Signatures */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Penerima,</Text>
                        <View style={styles.signatureLine}>
                            <Text>( ____________ )</Text>
                        </View>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Hormat Kami,</Text>
                        <View style={styles.signatureLine}>
                            <Text>ShoshaMart</Text>
                        </View>
                    </View>

                    {/* Total Box */}
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>Rp {formatCurrency(order.totalAmount)}</Text>
                        </View>
                        <Text style={styles.terbilang}>
                            # {order.totalAmount.toLocaleString('id-ID')} Rupiah #
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

