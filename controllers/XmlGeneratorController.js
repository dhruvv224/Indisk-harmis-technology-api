const Order = require("../models/Order");
const Restaurant = require("../models/RestaurantCreate");
const { create } = require("xmlbuilder2");

const generateSaftXml = async (req, res) => {
  try {
    const { managerId, startDate, endDate } = req.body;

    // fetch orders + restaurant
const orders = await Order.find({
  manager_id: managerId,
  created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
});

const restaurant = await Restaurant.findOne({
  manager_id: managerId,
  created_at: { $gte: new Date(startDate), $lte: new Date(endDate) }, // change to actual field name
});
console.log(":orders", orders, ":restaurant", restaurant);

    if (!orders.length) return res.status(404).json({ message: "No orders" });
    if (!restaurant) return res.status(404).json({ message: "No restaurant" });

    const now = new Date();
    const datePart = now.toISOString().split("T")[0];
    const timePart = now.toTimeString().split(" ")[0];

    const xmlObj = {
      auditfile: {
        header: {
          fiscalYear: "2024",
          startDate,
          endDate,
          curCode: "DKK",
          dateCreated: datePart,
          timeCreated: timePart,
          softwareDesc: "Indisk: Centralized system for restaurant handling by ExpatMeal restaurants",
          softwareVersion: "1.0.0",
          softwareCompanyName: "Indisk",
          auditfileVersion: "1.2",
          headerComment: "Danish SAF-T Cash Register data export",
          userID: managerId.toString(),
        },
        company: {
          companyIdent: "37287482",
          companyName: "Indisk by ExpatMeal",
          taxRegistrationCountry: "DK",
          taxRegIdent: "37287482",

          generalLedger: {
            ledgerAccount: {
              accID: "1",
              accDesc: "Account Description",
            },
          },

          streetAddress: {
            streetname: restaurant?.streetname,
            number: restaurant?.phone,
            building: restaurant?.building,
            additionalAddressDetails: restaurant?.additional || "",
            city: restaurant?.city,
            postalCode: restaurant?.postalCode,
            country: restaurant.country,
          },

          postalAddress: {
            streetname: restaurant?.streetname,
            number: restaurant?.number,
            building: restaurant?.building,
            additionalAddressDetails: restaurant?.additional || "",
            city: restaurant?.city,
            postalCode: restaurant?.postalCode,
            country: restaurant.country,
          },

          vatCodeDetails: {
            vatCodeDetail: {
              vatCode: "1",
              dateOfEntry: "2020-01-01",
              vatDesc: "Salgsmoms varer og ydelser, 25 %",
              standardVatCode: "1",
            },
          },

          employees: {
            employee: restaurant?.employees?.map(emp => ({
              empID: emp._id.toString(),
              dateOfEntry: emp.dateOfEntry,
              timeOfEntry: emp.timeOfEntry,
              firstName: emp.firstName,
              surName: emp.lastName,
              employeeRole: {
                roleType: emp.role,
                roleTypeDesc: emp.role,
              },
            })),
          },

          articles: {
            article: restaurant?.articles?.map(a => ({
              artID: a.id,
              dateOfEntry: a.dateOfEntry,
              artGroupID: a.groupId,
              artDesc: a.description,
            })),
          },

          basics: {
            basic: [
              { basicType: "11", basicID: "100", predefinedBasicID: "11001", basicDesc: "kontantsalg" },
              { basicType: "12", basicID: "200", predefinedBasicID: "12001", basicDesc: "Cash" },
            ],
          },

          locations: {
            location: {
              name: restaurant?.name,
              streetAddress: {
                streetname: restaurant?.streetname,
                number: restaurant?.phone,
                building: restaurant?.building,
                additionalAddressDetails: restaurant?.additional || "",
                city: restaurant?.city,
                postalCode: restaurant?.postalCode,
                country: restaurant?.country,
              },
              cashregister: {
                registerID: "123.45678-A",
                regDesc: "Ved indgangen til butikken",
                cashtransaction: orders.map(order => {
                  const iso = new Date(order.order_date).toISOString();
                  const [d, t] = iso.split("T");

                  return {
                    nr: order._id.toString(),
                    transID: order._id.toString(),
                    transType: "11001",
                    transAmntIn: order.total_amount.toFixed(2),
                    transAmntEx: order.sub_total.toFixed(2),
                    amntTp: "C",
                    empID: order.manager_id.toString(),
                    transDate: d,
                    transTime: t.split(".")[0],
                    signature: "MIICWgIBAAKBgQCsN...", // static/dynamic
                    keyVersion: "1",
                    certificateData: "-----BEGIN CERTIFICATE-----\nMIIGfDCCBDCgAwIBAg...\n-----END CERTIFICATE-----",
                    voidTransaction: "false",
                    trainingId: "false",
                    ctLine: order.items.map((item, i) => ({
                      nr: order._id.toString(),
                      lineID: i + 1,
                      lineType: "Sale",
                      artGroupID: item.groupId,
                      artID: item.food_item.toString(),
                      qnt: item.quantity,
                      lineAmntIn: (item.base_price * (1 + order.vatPercentage / 100)).toFixed(2),
                      lineAmntEx: item.base_price.toFixed(2),
                      amntTp: "C",
                      ppu: item.base_price.toFixed(2),
                      vat: {
                        vatPerc: order.vatPercentage.toFixed(2),
                        vatAmnt: order.vat.toFixed(2),
                        vatAmntTp: "C",
                      },
                    })),
                    vat: {
                      vatPerc: order.vatPercentage.toFixed(2),
                      vatAmnt: order.vat.toFixed(2),
                      vatAmntTp: "C",
                    },
                    payment: {
                      paymentType: order.payment_type,
                      paidAmnt: order.total_amount.toFixed(2),
                      empID: order.manager_id.toString(),
                      curCode: "DKK",
                    },
                  };
                }),
              },
            },
          },
        },
      },
    };
    const xml = create(xmlObj).end({ prettyPrint: true });

    // 👇 Force browser to download as file
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=saft-report.xml");
    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed", error: err.message });
  }
};
module.exports = { generateSaftXml };