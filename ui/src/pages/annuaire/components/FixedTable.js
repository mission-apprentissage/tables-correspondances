import styled from "styled-components";
import { Table } from "tabler-react";

const FixedTable = styled(Table)`
  table-layout: fixed;
  .value {
    color: darkgray;
    font-size: 0.75rem;
  }
`;

export default FixedTable;
