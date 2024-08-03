const orderSchema = require('../../model/orderSchema');

const ExcelJS = require('exceljs');
const PDFdocs = require('pdfkit-table')


const salePage =async (req,res)=>{
    try{
        const orderCount = await orderSchema.countDocuments()
        const revenueResult = await orderSchema.aggregate([
            {$match: {orderStatus: { $in: ['Shipped', 'Delivered'] }}},
            {$group: {_id: null,total: { $sum: "$totalPrice" }}}]);

        const Revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        const product = await orderSchema.aggregate([
            {$group: {_id: null,total: { $sum: "$totalQuantity" }}}]);

        const productCount = product.length > 0 ? product[0].total : 0;
        res.render('admin/salesreport',{
            title:"Sales Report" ,
            alertMessage:req.flash('alert'), 
            Revenue , 
            productCount , 
            orderCount 
        })
    }catch(error){
        console.log(`error while render sale report ${error}`)
    }
}


const getSalesByMonth = async (req, res) => {
    try {
        const sales = await orderSchema.aggregate([
            { $match: { orderStatus: { $in: ['Confirmed', 'Delivered', 'Shipped', 'Pending'] } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    totalSales: { $sum: "$totalPrice" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        res.json(sales);
    } catch (error) {
        console.log(`error in get sales by month ${error}`);
        res.json(error);
    }
};



const getOrderDetails = async (req, res) => {
    let { startDate, endDate, salesreportType, page = 1, limit = 5 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);
    let skip = (page - 1) * limit;

    let orderDetails;
    let match = {};
    
    try {
        const now = new Date();
        if (salesreportType === 'custom') {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        
            match = {
                createdAt: { $gte: start, $lte: end }
            };
        } else if (salesreportType === 'monthly') {
            endDate = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            match = { createdAt: { $gte: startDate, $lte: endDate} };
        } else if (salesreportType === 'yearly') {
            endDate = new Date();
            startDate = new Date(now.getFullYear(), 0, 1);
            match = { createdAt: { $gte: startDate, $lte: endDate } };
        } else if (salesreportType === 'weekly') {
            endDate = new Date();
            const currentDate = new Date();
            const diff = currentDate.getDate() - currentDate.getDay();
            startDate = new Date(currentDate.setDate(diff));
            match = { createdAt: { $gte: startDate, $lte: endDate } };
        }

        orderDetails = await orderSchema.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'coupons',
                    localField: 'coupen_id',
                    foreignField: '_id',
                    as: 'coupen_data'
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const totalRecords = await orderSchema.countDocuments(match);
        const totalPages = Math.ceil(totalRecords / limit);

        res.json({ orderDetails, totalPages, currentPage: page });
    } catch (error) {
        console.log(`error while render the order details ${error}`);
        res.status(400).json(error);
    }
};


// ----------------------------- downloading report --------------------------- 

const downloadPDF = async (req, res) => {
    const { salesreportType, startDate, endDate ,reportType } = req.body;
    let match = {};
    if (salesreportType !== "") {
        match = {
            createdAt: { $lte: new Date(endDate), $gte: new Date(startDate) },
        };
    }

    try {
        let orderDetails = await orderSchema.aggregate([
            { $match: match },
            {   
                $lookup: {
                    from: 'coupons',
                    localField: 'coupen_id',
                    foreignField: '_id',
                    as: 'coupen_data'
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        if (orderDetails.length > 0) {
            console.log(reportType,"reportType")
            if(reportType === 'PDF')
            await generatePdf(orderDetails, res);
            else if(reportType === 'EXCEL')
            {
                await generateExcel(orderDetails, res);
            }
        } else {
            res.status(404).json({ message: "No orders found for the specified period." });
        }
    } catch (error) {
        console.log(`error while download pdf ${error}`);
        res.status(500).json({ message: error.message });
    }
}

//-------------------------- PDF ----------------------------

async function generatePdf(orders, res) {
    const totalOrders = orders.length;
    const totalRevenue = orders
        .filter(order => order.status !== 'Confirmed' && order.status !== 'Cancelled' && order.status !== 'Returned')
        .reduce((acc, curr) => acc + curr.totalPrice, 0);

    const doc = new PDFdocs();
    const filename = 'sales-report.pdf';

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('Sip Savvy', 50, 50)
        .fontSize(10)
        .text('Kadavoor', 50, 80)
        .text(' Kollam, 691601', 50, 95)
        .fontSize(20)
        .text('Sales Report', 250, 50, { align: 'center' })
        .fontSize(10)
        .text('Generated on:', 400, 50, { align: 'right' })
        .text(new Date().toLocaleDateString(), 400, 65, { align: 'right' });

    // Summary
    doc.roundedRect(50, 120, 500, 60, 10).stroke();
    doc.fontSize(12).text('Summary', 60, 130);
    doc.fontSize(10)
        .text(`Total Orders: ${totalOrders}`, 60, 150)
        .text(`Total Revenue: Rs ${totalRevenue.toFixed(2)}`, 300, 150);

    // Table
    doc.moveDown(2);
    const tableTop = 200;
    doc.font("Helvetica-Bold").fontSize(10);
    
    // Table headers
    ['Order Id', 'Address', 'Payment Method', 'Order Status', 'Total'].forEach((header, i) => {
        doc.text(header, 50 + i * 100, tableTop);
    });

    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    // Table rows
    let y = tableTop + 30;
    orders.forEach((order, index) => {
        doc.font("Helvetica").fontSize(8);
        doc.text(order.order_id, 50, y);
        doc.text(order.address.building + '\n' + order.address.street + ' ' + order.address.city + "\n" + "Pincode: " + order.address.pincode, 150, y, { width: 100 });
        doc.text(order.paymentMethod, 250, y);
        doc.text(order.orderStatus, 350, y);
        doc.text('Rs ' + order.totalPrice.toFixed(2), 450, y);

        y += 40;
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    doc.end();
}


//-------------------------- Excel ----------------------------

async function generateExcel(orders, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "Pincode", key: "pin", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "orderDate", width: 18 },
        { header: "Total", key: "total", width: 15 },
    ];

    let totalSale = orders
    .filter(order => order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'returned')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);
    let totalOrders = 0;

    for (const order of orders) {
        const orderId = order.order_id;
        const orderDate = order.createdAt;
        const address = order.address.building + '\n' + order.address.street + ' ' + order.address.city;
        const pin = order.address.pincode;
        const status = order.orderStatus;
        const total = order.totalPrice;

        worksheet.addRow({
            orderId,
            orderDate,
            address,
            pin,
            status,
            total
        });
        totalOrders++;
    }

    worksheet.addRow({
        orderId: "Total",
        productName: "",
        price: "",
        quantity: "",
        status: "",
        address: "",
        pin: "",
        orderDate: ""
    });

    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true };
    worksheet.getCell(`A${worksheet.rowCount}`).value = `Total Orders: ${totalOrders}`;

    worksheet.getCell(`E${worksheet.rowCount}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`E${worksheet.rowCount}`).font = { bold: true };
    worksheet.getCell(`E${worksheet.rowCount}`).value = `Total Revenue: ${totalSale.toFixed(2)}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const excelBuffer = Buffer.from(buffer);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    res.send(excelBuffer);
}


function generateTable(doc, tableData) {
    const { headers, rows } = tableData;
    
    const columnWidths = [60, 100, 60, 60, 70, 80, 70, 100, 100];
    
    const tableTop = 200;
    const rowHeight = 20;
    
    const itemTop = (index) => tableTop + (index + 1) * rowHeight;
    
    doc.font('Helvetica-Bold');
    headers.forEach((header, i) => {
        doc.fontSize(10).text(header, 10 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
    });
    doc.font('Helvetica');
    rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            doc.fontSize(8).text(cell, 5 + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0), itemTop(rowIndex));
        });
    });
}
function dateFormat(inputDate) {
    const formated = new Date(inputDate);
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = formated.toLocaleDateString("en-US", options);
    return formattedDate;
}





module.exports ={
                  salePage,
                  getSalesByMonth,
                  getOrderDetails,
                  downloadPDF,
                  generateTable,
                  dateFormat

                }