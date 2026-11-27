import { RegistrationSetting, RegistrationStatus } from "./RegistrationSetting";

const SINGLETON_ID = 1;

/** The one row this table ever has — created on first use, default "open". */
export async function getOrCreateRegistrationSetting(): Promise<RegistrationSetting> {
  const [row] = await RegistrationSetting.findOrCreate({
    where: { id: SINGLETON_ID },
    defaults: { id: SINGLETON_ID, status: RegistrationStatus.Open },
  });
  return row;
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const row = await getOrCreateRegistrationSetting();
  return row.get("status") as RegistrationStatus;
}
