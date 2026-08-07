-- Many-to-many link between postcode routing rules and Regional Directors,
-- mirroring the existing PostcodeRoutingToAreaDirectors table. Lets a single
-- postcode area be shared by more than one Regional Director for round-robin
-- lead routing.
CREATE TABLE "PostcodeRoutingToRegionalDirectors" (
    "postcode_routing_id" UUID NOT NULL,
    "regional_director_id" UUID NOT NULL,

    CONSTRAINT "PostcodeRoutingToRegionalDirectors_pkey" PRIMARY KEY ("postcode_routing_id", "regional_director_id")
);

CREATE INDEX "PostcodeRoutingToRegionalDirectors_postcode_routing_id_idx" ON "PostcodeRoutingToRegionalDirectors"("postcode_routing_id");

CREATE INDEX "PostcodeRoutingToRegionalDirectors_regional_director_id_idx" ON "PostcodeRoutingToRegionalDirectors"("regional_director_id");

ALTER TABLE "PostcodeRoutingToRegionalDirectors" ADD CONSTRAINT "PostcodeRoutingToRegionalDirectors_postcode_routing_id_fkey" FOREIGN KEY ("postcode_routing_id") REFERENCES "nextcrm_postcode_routing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostcodeRoutingToRegionalDirectors" ADD CONSTRAINT "PostcodeRoutingToRegionalDirectors_regional_director_id_fkey" FOREIGN KEY ("regional_director_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
