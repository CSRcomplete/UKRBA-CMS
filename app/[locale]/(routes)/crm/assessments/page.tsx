import Container from "../../components/ui/Container";
import { getAssessments } from "@/actions/crm/get-assessments";
import { AssessmentsTable } from "../components/AssessmentsTable";

/** Every assessment the current user may see (RD: their leads, AD: their area, admin: all). */
const AssessmentsPage = async () => {
  const rows = await getAssessments();

  return (
    <Container
      title="Assessments"
      description="5GBP assessments completed by your leads, with the generated report."
    >
      <AssessmentsTable rows={rows} />
    </Container>
  );
};

export default AssessmentsPage;
