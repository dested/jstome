import Navbar from "./navbar";
import { getServerSession } from "next-auth/next";

export default async function Nav() {
  return <Navbar  />;
}
