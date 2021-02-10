import React, { useState } from "react";
import { Button } from "tabler-react";

import styled from "styled-components";

const SortButton = styled(Button)`
  background-color: #ffffff;
  padding: 0;
  &:focus,
  &:active {
    box-shadow: none;
  }
`;

export default ({ onClick }) => {
  const [order, setOrder] = useState(-1);
  function toggleOrder() {
    let newValue = order * -1;
    setOrder(newValue);
    onClick(newValue);
  }

  return (
    <SortButton onClick={toggleOrder} size="sm">
      {order === 1 ? "\u25B2" : "\u25BC"}
    </SortButton>
  );
};
