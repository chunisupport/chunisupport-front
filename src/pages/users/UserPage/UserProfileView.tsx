import type { Component } from "solid-js";
import type { UserProfileWithRecordsDTO } from "../../../types/api";

type Props = {
  profile: UserProfileWithRecordsDTO;
};

export const UserProfileView: Component<Props> = (props) => {
  const { profile } = props;

  return (
    <div>
      <h2>プロファイル取得成功</h2>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
};
