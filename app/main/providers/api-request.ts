import needle from 'needle';
import Port from '../../common/constants/port';
import { Delivery } from '../../common/models/delivery';

const endpoints = {
  GET_CONTENTS: '/getContents',
  GET_POST_DELIVERY: '/getPostDelivery',
};
const { GET_CONTENTS, GET_POST_DELIVERY } = endpoints;

const port = Port.API_PORT;
const url = (hostIp: string, path: string) =>
  `http://${hostIp}:${port}/api${path}`;

export async function fetchDelivery(
  serialNumber: string,
  hostIp: string
): Promise<Delivery> {
  return new Promise((resolve, reject) => {
    needle('get', url(hostIp, `${GET_CONTENTS}/${serialNumber}`))
      .then((response) => {
        const { statusCode, body } = response;
        if (statusCode !== 200) {
          return reject(new Error(`${body.error}: ${body.message}`));
        }
        return resolve(body);
      })
      .catch((error) => reject(error));
  });
}

export async function fetchPostDelivery(
  schedule: string,
  serialNumber: string,
  hostIp: string
): Promise<Delivery> {
  return new Promise((resolve, reject) => {
    const formData = { schedule, serialNumber };
    needle('post', url(hostIp, GET_POST_DELIVERY), formData)
      .then((response) => {
        const { statusCode, body } = response;
        if (statusCode !== 200) {
          return reject(new Error(`${body.error}: ${body.message}`));
        }
        return resolve(body);
      })
      .catch((error) => reject(error));
  });
}
