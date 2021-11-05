/**
 * 每个页面都继承的一些属性
 */
export default interface IPageProps {
  showCancelBtn: Boolean;
  onCancel: () => void;
  onSubmit: (pageKey: string, value: any) => void;
}
