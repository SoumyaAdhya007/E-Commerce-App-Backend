const express = require("express");
const PaymentRouter = express.Router();
const razorpay = require("../Config/razorpayClient");
const UserModel = require("../Models/user.model");
// const { default: paymentLink } = require("razorpay/dist/types/paymentLink");
const { Authentication } = require("../Middleware/authentication.middleware");
PaymentRouter.use(Authentication);
PaymentRouter.post("/", async (req, res) => {
  const { userID, totalPrice } = req.body;
  try {
    const user = await UserModel.findOne({ _id: userID });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const paymentLinkReq = {
      amount: totalPrice * 100,
      currency: "INR",
      customer: {
        name: user.name,
        contact: String(user.phone),
        email: user.email,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      callback_url: `http://localhost:5173/checkout?step=3`,
      callback_method: "get",
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkReq);
    if (paymentLink) {
      const paymentLinkId = paymentLink.id;
      const payment_link_url = paymentLink.short_url;

      return res.status(200).send({
        paymentId: paymentLinkId,
        url: payment_link_url,
      });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});
PaymentRouter.get("/", async (req, res) => {
  const { paymentId } = req.query;
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status === "captured") {
      res.status(200).send({ message: "Payment successful" });
    } else {
      res.status(200).send({ message: "Payment unsuccessful" });
    }
    // res.send(payment);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});
module.exports = { PaymentRouter };
