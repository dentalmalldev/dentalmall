import { Header } from "@/components/layout/header/header";
import {
  Hero,
  Categories,
  Products,
  FAQ,
  PartnerStores,
  BecomeUser,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Categories />
      <Products />
      <PartnerStores />
      <BecomeUser />
      <FAQ />
    </>
  );
}
