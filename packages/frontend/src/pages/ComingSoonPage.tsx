interface ComingSoonPageProps {
  sectionName: string;
}

export function ComingSoonPage({ sectionName }: ComingSoonPageProps) {
  return (
    <div className="max-w-xl mx-auto mt-16 text-center">
      <h2 className="text-lg font-semibold text-forti-dark">{sectionName}</h2>
      <p className="mt-2 text-gray-500">
        This section is part of FortiSim's roadmap and isn't available yet.
        For now, head to <span className="font-medium">Policy &amp; Objects</span> to
        work on firewall policy exercises.
      </p>
    </div>
  );
}
