import React from "react";
import { Badge } from "tabler-react";

export default ({ item }) => {
  return (
    <div>
      <span style={{ paddingRight: "1rem" }}>{item.uai}</span>
      <Badge>{item.type}</Badge>
    </div>
  );
};
