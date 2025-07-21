import axios from 'axios';
import { myFatoorahSettings } from '../../configVars';

const token = myFatoorahSettings.token;
const baseURL = myFatoorahSettings.baseUrl;

export const createInvoice = async ({
  NotificationOption,
  CustomerName,
  InvoiceValue,
  InvoicePaymentMethods,
  orderId,
}: any) => {
  try {
    const url = baseURL + '/v2/SendPayment';

    const headers = {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    };

    const data = {
      NotificationOption,
      CustomerName,
      InvoiceValue,
      CallBackUrl: `https://milagro-shop.netlify.app/?from_payment=success&orderId=${orderId}`,
      ErrorUrl: 'https://milagro-shop.netlify.app/?from_payment=failed',
      InvoicePaymentMethods,
    };

    const result = await axios({
      method: 'post',
      url,
      data,
      headers,
    });

    return result.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw new Error(error);
  }
};

export const getInvoiceStatus = async (Key: string) => {
  try {
    const url = baseURL + '/v2/getPaymentStatus';

    const headers = {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    };

    const data = {
      Key,
      KeyType: 'invoiceid',
    };

    const result = await axios({
      method: 'post',
      url,
      data,
      headers,
    });

    return result.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw new Error(error);
  }
};

export const refundInvoice = async ({ Key, Amount }: any) => {
  try {
    const url = baseURL + '/v2/MakeRefund';

    const headers = {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    };

    const data = {
      Key,
      KeyType: 'invoiceid',
      Amount,
    };

    const result = await axios({
      method: 'post',
      url,
      data,
      headers,
    });

    return result.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw new Error(error);
  }
};

export const fetchPaymentMethods = async ({
  InvoiceAmount,
  CurrencyIso,
}: any) => {
  try {
    const url = baseURL + '/v2/InitiatePayment';

    const headers = {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    };

    const data = {
      CurrencyIso,
      InvoiceAmount,
    };

    const result = await axios({
      method: 'post',
      url,
      data,
      headers,
    });

    return result.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw new Error(error);
  }
};
