import pako from 'pako';
import fetch from 'cross-fetch';
import { Buffer } from 'buffer';
import jose from 'node-jose';
import base64url from 'base64url';

export interface HealthCard {
  jws: string;
  validated: null | {
    iss: string;
    nbf: number;
    vc: {
      type: string[];
      credentialSubject: {
        fhirVersion: string;
        fhirBundle: {
          entry: {
            fullUrl: string;
            resource: {
              resourceType: string;
              [k: string]: string;
            };
          }[];
        };
      };
    };
  };
}

export const fromJws = async (jws: string): Promise<HealthCard> => {
  // peek at issuer
  const payloadBinary = base64url.toBuffer(jws.split('.')[1]);
  const payload = pako.inflateRaw(payloadBinary);
  const payloadUnverified = JSON.parse(Buffer.from(payload).toString());
  const iss = payloadUnverified['iss'];

  const jwks = await (await fetch(iss + '/.well-known/jwks.json')).json();
  const keyStore = await jose.JWK.asKeyStore(jwks);

  try {
    await jose.JWS.createVerify(keyStore).verify(jws); // throws when invalid
    return {
      jws,
      validated: payloadUnverified 
    };
  } catch (err) {
    return {
      jws,
      validated: null
    };
  }
};
