using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class TestDoc : IDocument {
    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    public void Compose(IDocumentContainer container) {
        container.Page(page => {
            page.Content().Column(col => {
                col.Item().Text(text => {
                    text.DefaultTextStyle(x => x.FontSize(10.5f));
                    text.Span("Test");
                });
            });
        });
    }
}
