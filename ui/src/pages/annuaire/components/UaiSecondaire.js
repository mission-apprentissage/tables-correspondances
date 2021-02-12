import React from "react";

export default ({ item }) => {
  return (
    <div>
      <span style={{ paddingRight: "0.5rem" }}>{item.uai}</span>
      <span>(source : {item.type})</span>
    </div>
  );
};
