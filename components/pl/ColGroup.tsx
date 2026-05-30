export function ColGroup({ isOwner }: { isOwner: boolean }) {
  return (
    <colgroup>
      <col style={{ width: "16%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "7%" }} />
      <col style={{ width: "9%" }} />
      <col style={{ width: "9%" }} />
      <col style={{ width: "9%" }} />
      {isOwner ? (
        <>
          <col style={{ width: "20%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
        </>
      ) : (
        <>
          <col style={{ width: "29%" }} />
          <col style={{ width: "9%" }} />
        </>
      )}
    </colgroup>
  );
}
