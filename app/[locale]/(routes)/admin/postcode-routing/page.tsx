import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPostcodeRoutes } from "./actions";
import { PostcodeRoutingTable } from "./_components/PostcodeRoutingTable";

export default async function PostcodeRoutingPage() {
  const routes = await getPostcodeRoutes();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Postcode Routing</CardTitle>
          <CardDescription>
            Manage regional routing rules based on UK postcode prefixes. These rules automatically route incoming Wix website leads to the responsible Region and Directors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostcodeRoutingTable initialRoutes={routes} />
        </CardContent>
      </Card>
    </div>
  );
}
