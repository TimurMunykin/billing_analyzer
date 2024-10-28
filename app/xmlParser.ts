import { parseStringPromise } from "xml2js";
import pool from "./db";

export const parseXML = async (xmlData: string): Promise<void> => {
  const json = await parseStringPromise(xmlData);

  const calls = json.calls.call.map((call: any) => ({
    caller: call.caller[0],
    receiver: call.receiver[0],
    call_date: call.date[0],
    duration_minutes: parseInt(call.duration[0], 10),
    cost: parseFloat(call.cost[0]),
    service_type: call.serviceType[0],
  }));

  const client = await pool.connect();
  try {
    for (const call of calls) {
      await client.query(
        `INSERT INTO calls (caller, receiver, call_date, duration_minutes, cost, service_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          call.caller,
          call.receiver,
          call.call_date,
          call.duration_minutes,
          call.cost,
          call.service_type,
        ]
      );
    }
  } finally {
    client.release();
  }
};
