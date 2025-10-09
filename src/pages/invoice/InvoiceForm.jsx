import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Space,
  Radio,
  theme,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  PrinterOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import dayjs from "dayjs";
import axios from "../../api/axios"; // Assuming this path is correct for your project
import { toast } from "react-hot-toast"; // Assuming react-hot-toast is installed

const { Option } = Select;
const { TextArea } = Input;
const { useToken } = theme;

const InvoiceForm = ({ onCancel, onSave, initialValues, isSaving }) => {
  const [form] = Form.useForm();
  // State to manage individual invoice items
  const [items, setItems] = useState([
    {
      id: 1, // Unique ID for each item in the UI
      productId: null, // Stores the ID of the selected product
      productName: "", // Stores the product name for display
      description: "",
      hsnSac: "",
      quantity: 1,
      quantityType: "", // e.g., "Nos", "Kgs"
      rate: 0, // Price per unit
      specifications: [{ key: Date.now(), name: "", value: "" }], // Product specifications
    },
  ]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [dueDate, setDueDate] = useState(null);
  const [businessOptions, setBusinessOptions] = useState([]); // Options for the business dropdown
  const [taxRate, setTaxRate] = useState(18); // Default GST rate, can be manually entered
  const [productOptions, setProductOptions] = useState([]); // Options for the product dropdown
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState(null); // Details of the selected business
  const [gstType, setGstType] = useState(null); // GST Type: "interstate" or "intrastate"

  const { token } = useToken(); // Ant Design theme token for styling

  // Styles object for consistent styling across the form
  const styles = {
    mainCardTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: token.colorPrimary,
    },
    quotationCard: {
      borderRadius: token.borderRadiusLG,
    },
    formField: {
      width: "100%",
    },
    readOnlyFormField: {
      width: "100%",
      backgroundColor: token.colorFillAlter,
      color: token.colorTextDisabled,
      cursor: "not-allowed",
    },
    textAreaField: {
      width: "100%",
      resize: "vertical",
    },
    readOnlyTextArea: {
      width: "100%",
      backgroundColor: token.colorFillAlter,
      color: token.colorTextDisabled,
      cursor: "not-allowed",
      resize: "vertical",
    },
    businessInfoCard: {
      backgroundColor: token.colorFillAlter,
      borderColor: token.colorBorderSecondary,
      borderRadius: token.borderRadiusSM,
    },
    businessInfoPre: {
      whiteSpace: "pre-wrap",
      fontFamily: "Roboto, sans-serif",
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
      margin: 0,
    },
    divider: {
      margin: "24px 0",
      borderColor: token.colorBorderSecondary,
    },
    itemCard: {
      marginBottom: token.margin,
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorder}`,
    },
    deleteButton: {
      color: token.colorError,
    },
    specificationDivider: {
      margin: "16px 0 8px 0",
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
    },
    specificationRow: {
      marginBottom: token.marginXS,
    },
    addButton: {
      width: "100%",
      borderColor: token.colorPrimaryBorder,
      color: token.colorPrimary,
    },
    addSpecButton: {
      marginTop: token.margin,
      borderColor: token.colorBorder,
      color: token.colorTextSecondary,
    },
    addItemButton: {
      marginTop: token.margin,
      borderColor: token.colorBorder,
      color: token.colorTextSecondary,
    },
    summaryRow: {
      marginBottom: token.margin,
    },
    totalField: {
      backgroundColor: token.colorFillAlter,
      color: token.colorText,
      fontWeight: "bold",
      fontSize: token.fontSizeLG,
    },
    grandTotalField: {
      backgroundColor: token.colorSuccessBg,
      color: token.colorSuccessText,
      fontWeight: "bold",
      fontSize: token.fontSizeXL,
    },
    notesCard: {
      backgroundColor: token.colorFillAlter,
      borderColor: token.colorBorderSecondary,
      borderRadius: token.borderRadiusSM,
    },
    noteText: {
      marginBottom: token.marginXS,
      color: token.colorTextSecondary,
    },
    buttonGroup: {
      marginTop: token.marginXL,
      textAlign: "right",
    },
  };

  // Refs to prevent redundant API calls
  const hasFetchedBusinessOptions = useRef(false);
  const hasFetchedProductOptions = useRef(false);

  // Helper function to get current user from local storage
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.email || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  // Formats business information for display
  const formatBusinessInfo = useCallback((business) => {
    if (!business) return "";
    return `
${business.businessName?.toUpperCase()}
${business.contactName ? `Mr. ${business.contactName?.toUpperCase()}` : ""}
${business.addressLine1 || ""}${
      business.addressLine2 ? ", " + business.addressLine2 : ""
    }
${business.city || ""}${business.pincode ? " - " + business.pincode : ""}
${business.state || ""}, ${business.country || ""}
${business.gstNumber || ""}
`.trim();
  }, []);

  // Fetches business options from the API
  const fetchBusinessOptions = useCallback(async () => {
    if (hasFetchedBusinessOptions.current) return;
    hasFetchedBusinessOptions.current = true;

    const toastId = toast.loading("Loading business options...");
    try {
      const res = await axios.get("/api/invoices/leads/active");
      setBusinessOptions(res.data);
      toast.success("Business options loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load businesses", { id: toastId });
      console.error("Error fetching business options:", error);
      hasFetchedBusinessOptions.current = false; // Allow retry on failure
    }
  }, []);

  // Fetches product options from the API
  const fetchProductOptions = useCallback(async () => {
    if (hasFetchedProductOptions.current) return;
    hasFetchedProductOptions.current = true;

    const toastId = toast.loading("Loading product options...");
    try {
      const res = await axios.get("/api/product");
      setProductOptions(
        res.data.map((p) => ({
          ...p,
          hsnSac: p.hsnSac || "",
          quantityType: p.quantityType || "",
          options: p.options || [], // Ensure options array exists
        }))
      );
      toast.success("Product options loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load products", { id: toastId });
      console.error("Error fetching product options:", error);
      hasFetchedProductOptions.current = false; // Allow retry on failure
    }
  }, []);

  // Effect hook to load data and set initial form values when component mounts or initialValues change
  useEffect(() => {
    fetchBusinessOptions();
    fetchProductOptions();
  }, [fetchBusinessOptions, fetchProductOptions]); // Fetch options only once on mount

  // Separate useEffect for handling initialValues once options are loaded
  useEffect(() => {
    if (initialValues && productOptions.length > 0 && businessOptions.length > 0) {
      console.log("Initial Values Effect triggered.");
      console.log("initialValues:", initialValues);
      console.log("productOptions:", productOptions);

      // Determine the correct business ID, handling both object and string formats
      const selectedBusinessId =
        initialValues.businessId?._id || initialValues.businessId;
      const selectedBusiness = businessOptions.find(
        (b) => b._id === selectedBusinessId
      );

      // Set form fields with initial values
      form.setFieldsValue({
        ...initialValues,
        date: initialValues.date ? dayjs(initialValues.date) : null,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
        paymentStatus: initialValues.paymentStatus || "pending",
        invoiceType: "Invoice", // Hardcode to Invoice as per requirement
        gstType: initialValues.gstType || null,
        businessName: selectedBusiness?.businessName,
        businessType: selectedBusiness?.type,
        businessInfo: selectedBusiness
          ? formatBusinessInfo(selectedBusiness)
          : "",
        gstin: selectedBusiness?.gstNumber || "",
        businessId: selectedBusiness?._id,
        // Set initial values for contactName, email, mobileNumber from initialValues
        contactName: initialValues.contactName || "",
        email: initialValues.email || "",
        mobileNumber: initialValues.mobileNumber || "",
      });

      // Map initialValues.items to include product names for display
      const updatedItems = initialValues.items.map(item => {
        // Ensure item.productId is a string ID for lookup
        const currentProductId = item.productId?._id || item.productId;
        const product = productOptions.find(p => p._id === currentProductId);

        console.log(`--- Item Processing ---`);
        console.log(`Original item.productId:`, item.productId);
        console.log(`ID used for lookup (currentProductId):`, currentProductId);
        console.log(`Found product:`, product);

        return {
          ...item,
          id: item.id || Date.now() + Math.random(), // Ensure item has a unique ID for React keys
          productId: currentProductId, // Ensure productId is just the string ID for the Select value
          // Prioritize item.productName from initialValues, fallback to lookup, then description
          productName: item.productName || (product ? (product.productName || product.name) : (item.description || "Product Not Found")),
          rate: item.rate || (product ? product.price : 0), // Ensure rate is set, fallback to product price
          description: item.description || (product ? product.description : ""), // Fallback for description
          hsnSac: item.hsnSac || (product ? product.hsnSac : ""), // Fallback for HSN/SAC
          quantityType: item.quantityType || (product ? product.quantityType : ""), // Fallback for quantityType
          specifications: item.specifications || (product && product.options ? product.options.map((opt) => ({
            key: Date.now() + Math.random(),
            name: opt.type || "",
            value: opt.description || "",
          })) : [{ key: Date.now() + Math.random(), name: "", value: "" }]),
        };
      });
      setItems(updatedItems);
      console.log("Updated Items after mapping:", updatedItems);

      setPaymentStatus(initialValues.paymentStatus || "pending");
      setDueDate(initialValues.dueDate ? dayjs(initialValues.dueDate) : null);
      setGstType(initialValues.gstType || null);
      setTaxRate(initialValues.gstPercentage || 18); // Default to 18 if not set
      if (selectedBusiness) {
        setSelectedBusinessDetails(selectedBusiness);
      }
    }
  }, [
    initialValues,
    productOptions, // Dependency added for productOptions
    businessOptions, // Dependency added for businessOptions
    form,
    formatBusinessInfo,
  ]);


  // Adds a new blank item row to the invoice
  const addItem = () => {
    const nextId = Math.max(0, ...items.map((i) => i.id)) + 1; // Generate unique ID
    setItems([
      ...items,
      {
        id: nextId,
        productId: null,
        productName: "", // Initialize productName for new item
        description: "",
        hsnSac: "",
        quantity: 1,
        quantityType: "",
        rate: 0,
        specifications: [{ key: Date.now() + Math.random(), name: "", value: "" }], // Ensure unique key for new spec
      },
    ]);
  };

  // Updates a specific property of an item
  const updateItem = (id, key, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (key === "productId") {
            // If product is selected, populate related fields
            const selectedProduct = productOptions.find((p) => p._id === value);
            if (selectedProduct) {
              return {
                ...item,
                productId: value,
                productName: selectedProduct.productName || selectedProduct.name, // Set product name for display
                description: selectedProduct.description || "",
                hsnSac: selectedProduct.hsnSac || "",
                rate: selectedProduct.price || 0, // Crucial: Set rate from product's price
                quantityType: selectedProduct.quantityType || "",
                // Populate specifications from product options if available, otherwise default
                specifications:
                  selectedProduct.options && selectedProduct.options.length > 0
                    ? selectedProduct.options.map((opt) => ({
                        key: Date.now() + Math.random(), // Ensure unique key
                        name: opt.type || "",
                        value: opt.description || "",
                      }))
                    : [
                        {
                          key: Date.now() + Math.random(), // Ensure unique key
                          name: "",
                          value: "",
                        },
                      ],
              };
            }
          }
          return { ...item, [key]: value }; // Update other item properties
        }
        return item;
      })
    );
  };

  // Removes an item row from the invoice
  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Adds a new specification field to a specific item
  const addSpecification = (itemId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: [
                ...item.specifications,
                { key: Date.now() + Math.random(), name: "", value: "" },
              ],
            }
          : item
      )
    );
  };

  // Removes a specification field from a specific item
  const removeSpecification = (itemId, specKey) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: item.specifications.filter(
                (spec) => spec.key !== specKey
              ),
            }
          : item
      )
    );
  };

  // Updates a specific field of a specification for an item
  const updateSpecification = (itemId, specKey, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: item.specifications.map((spec) =>
                spec.key === specKey ? { ...spec, [field]: value } : spec
              ),
            }
          : item
      )
    );
  };

  // Calculates the sum of all item totals
  const calculateSubTotal = () =>
    items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );

  // Calculates the total GST amount based on sub-total and tax rate
  const calculateTotalGSTAmount = () => calculateSubTotal() * (taxRate / 100);

  // Calculates IGST amount (for interstate)
  const calculateIGST = () => {
    return gstType === "interstate" ? calculateTotalGSTAmount() : 0;
  };

  // Calculates CGST amount (for intrastate)
  const calculateCGST = () => {
    return gstType === "intrastate" ? calculateTotalGSTAmount() / 2 : 0;
  };

  // Calculates SGST amount (for intrastate)
  const calculateSGST = () => {
    return gstType === "intrastate" ? calculateTotalGSTAmount() / 2 : 0;
  };

  // Calculates the grand total of the invoice
  const calculateGrandTotal = () =>
    calculateSubTotal() + calculateTotalGSTAmount();

  // Handles selection of a business from the dropdown
  const handleBusinessSelect = (id) => {
    const selected = businessOptions.find((b) => b._id === id);
    if (selected) {
      setSelectedBusinessDetails(selected);
      const fullInfo = formatBusinessInfo(selected);
      // Set form fields related to the selected business
      form.setFieldsValue({
        businessId: selected._id,
        businessName: selected.businessName,
        businessType: selected.type,
        gstin: selected.gstNumber,
        businessInfo: fullInfo,
        contactName: selected.contactName || "",
        email: selected.email || "",
        mobileNumber: selected.mobileNumber || "",
      });
    } else {
      // Clear business-related fields if no business is selected
      setSelectedBusinessDetails(null);
      form.setFieldsValue({
        businessId: null,
        businessName: null,
        businessType: null,
        gstin: null,
        businessInfo: "",
        contactName: "",
        email: "",
        mobileNumber: "",
      });
    }
  };

  // Handles form submission
  const onFinish = (values) => {
    if (!items || items.length === 0) {
      toast.error("At least one item is required.");
      return;
    }
    if (!gstType) {
      toast.error("Please select a GST type.");
      return;
    }

    const subTotal = calculateSubTotal();
    const gstPercentage = taxRate;
    const totalAmount = calculateGrandTotal();

    // Prepare new payment entry if provided
    const newPayment = {
      amount: values.newPaymentAmount,
      method: values.newPaymentMethod,
      reference: values.newPaymentReference,
      date: values.newPaymentDate?.format("YYYY-MM-DD"),
      addedBy: getCurrentUser(),
    };

    // Construct the invoice data object to be saved
    const invoiceData = {
      ...values,
      date: values.date?.format("YYYY-MM-DD"),
      dueDate: dueDate?.format("YYYY-MM-DD"),
      paymentStatus,
      items,
      subTotal,
      gstPercentage: gstPercentage,
      totalAmount,
      gstType: gstType,
      igstAmount: calculateIGST(),
      cgstAmount: calculateCGST(),
      sgstAmount: calculateSGST(),
      invoiceType: "Invoice", // Hardcode invoiceType to Invoice
      businessName: selectedBusinessDetails?.businessName,
      businessType: selectedBusinessDetails?.type,
      gstin: selectedBusinessDetails?.gstNumber,
      businessInfo: selectedBusinessDetails
        ? formatBusinessInfo(selectedBusinessDetails)
        : "",
      contactName: values.contactName,
      email: values.email,
      mobileNumber: values.mobileNumber,
    };

    // Add new payment to history if valid
    if (newPayment.amount && newPayment.method) {
      invoiceData.paymentHistory = [
        ...(initialValues?.paymentHistory || []),
        newPayment,
      ];
    }

    // Remove temporary payment fields before saving
    delete invoiceData.newPaymentAmount;
    delete invoiceData.newPaymentMethod;
    delete invoiceData.newPaymentReference;
    delete invoiceData.newPaymentDate;

    onSave(invoiceData); // Call the onSave prop with the prepared invoice data
  };

  // Handles printing the invoice by opening a new tab
  const handlePrintInvoice = () => {
    const values = form.getFieldsValue(true); // Get all current form values

    // Recalculate summary details for print
    const subTotal = calculateSubTotal();
    const gstPercentage = taxRate;
    const totalAmount = calculateGrandTotal();

    // Prepare invoice data for printing
    const invoiceDataForPrint = {
      ...values,
      date: values.date?.format("YYYY-MM-DD"),
      dueDate: dueDate?.format("YYYY-MM-DD"),
      paymentStatus,
      items,
      subTotal,
      gstPercentage: gstPercentage,
      totalAmount,
      gstType: gstType,
      igstAmount: calculateIGST(),
      cgstAmount: calculateCGST(),
      sgstAmount: calculateSGST(),
      invoiceNumber: initialValues?.invoiceNumber || "DRAFT", // Use existing or DRAFT
      invoiceType: "Invoice", // Always Invoice
      businessName: selectedBusinessDetails?.businessName,
      businessType: selectedBusinessDetails?.type,
      gstin: selectedBusinessDetails?.gstNumber,
      businessInfo: selectedBusinessDetails
        ? formatBusinessInfo(selectedBusinessDetails)
        : "",
      contactName: values.contactName,
      email: values.email,
      mobileNumber: values.mobileNumber,
      companyName: "Your Company Name", // Placeholder: Replace with actual company details
      companyAddress: "Your Company Address Line 1, City, State - PIN, Country", // Placeholder
      companyGSTIN: "YOURGSTIN12345", // Placeholder
      notes: initialValues?.notes || [], // Pass existing notes
      paymentTerms:
        initialValues?.paymentTerms ||
        "Payment due within 15 days of invoice date", // Pass existing payment terms
    };

    // Store data in localStorage and open new tab for printing
    localStorage.setItem("invoiceToPrint", JSON.stringify(invoiceDataForPrint));
    window.open("/print-invoice", "_blank"); // Assumes a route '/print-invoice' exists
  };

  return (
    <Card
      title={
        <span style={styles.mainCardTitle}>
          {initialValues ? "Edit Invoice" : "Create New Invoice"}
        </span>
      }
      loading={isSaving}
      style={styles.quotationCard}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Business and Invoice Details */}
        <Row gutter={[16, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Business Name"
              name="businessId"
              rules={[{ required: true, message: "Please select a business!" }]}
            >
              <Select
                placeholder="Select business"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleBusinessSelect}
                allowClear
                style={styles.formField}
              >
                {businessOptions.map((b) => (
                  <Option key={b._id} value={b._id}>
                    {b.businessName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {/* Hidden input to store businessName for form submission if needed */}
            <Form.Item name="businessName" hidden>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="businessType" label="Type">
              <Input readOnly style={styles.readOnlyFormField} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24]}>
          <Col xs={24} md={12}>
            <Form.Item label="Business Info">
              <Card bordered style={styles.businessInfoCard}>
                <pre style={styles.businessInfoPre}>
                  {form.getFieldValue("businessInfo") ||
                    "Select a business to view details..."}
                </pre>
              </Card>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Invoice Type"
              name="invoiceType"
              initialValue="Invoice" // Fixed to "Invoice"
            >
              <Input readOnly style={styles.readOnlyFormField} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          {initialValues?.invoiceNumber && (
            <Col span={12}>
              <Form.Item label="Invoice Number">
                <Input
                  value={initialValues.invoiceNumber}
                  readOnly
                  style={styles.readOnlyFormField}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item label="GSTIN" name="gstin">
              <Input readOnly style={styles.readOnlyFormField} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={styles.formField} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker
                style={styles.formField}
                format="DD/MM/YYYY"
                value={dueDate}
                onChange={setDueDate}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Contact Person Details */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Contact Person"
              name="contactName"
              rules={[
                {
                  required: true,
                  message: "Please enter contact person name!",
                },
              ]}
            >
              <Input style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Please enter a valid email!",
                },
              ]}
            >
              <Input style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Mobile Number"
              name="mobileNumber"
              rules={[
                { required: true, message: "Please enter mobile number!" },
              ]}
            >
              <Input style={styles.formField} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={styles.divider}>Invoice Items</Divider>
        {items.map((item, index) => {
          return (
            <Card key={item.id} style={styles.itemCard} size="small">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={8}>
                  Product Name
                  <Form.Item label="Product" noStyle>
                    <Select
                      key={item.productId || `new-item-${item.id}`} // Added key prop to force re-render
                      placeholder="Search or select a product"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(value) =>
                        updateItem(item.id, "productId", value)
                      }
                      value={item.productId} // This holds the product ID
                      style={styles.formField}
                    >
                      {/* Display the product name from the item state, or fallback to the option's children */}
                      {item.productName && !productOptions.some(p => p._id === item.productId) && (
                        <Option key={item.productId} value={item.productId}>
                          {item.productName}
                        </Option>
                      )}
                      {productOptions.map((p) => (
                        <Option key={p._id} value={p._id}>
                          {p.productName || p.name} {/* Display product name */}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={8}>
                  Quantity
                  <Form.Item label="Qty" noStyle>
                    <InputNumber
                      placeholder="1"
                      value={item.quantity}
                      onChange={(val) => updateItem(item.id, "quantity", val)}
                      style={styles.formField}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  Price (per unit)
                  <Form.Item label="Price (per unit)" noStyle>
                    <InputNumber
                      prefix="₹"
                      value={item.rate}
                      onChange={(val) => updateItem(item.id, "rate", val)}
                      min={0}
                      step={0.01}
                      style={styles.formField}
                    />
                  </Form.Item>
                </Col>
                <Col
                  xs={24}
                  sm={6}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => removeItem(item.id)}
                        type="text"
                        style={styles.deleteButton}
                      />
                    </Tooltip>
                  )}
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: token.margin }}>
                <Col xs={24} sm={8}>
                  HSN/SAC Code
                  <Form.Item label="HSN/SAC Code" noStyle>
                    <Input
                      placeholder="HSN/SAC"
                      value={item.hsnSac}
                      onChange={(e) =>
                        updateItem(item.id, "hsnSac", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  Item Total
                  <Form.Item label="Item Total" noStyle>
                    <Input
                      value={`₹${(
                        (item.quantity || 0) * (item.rate || 0)
                      ).toFixed(2)}`}
                      readOnly
                      style={styles.totalField}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  Description
                  <Form.Item label="Description" noStyle>
                    <TextArea
                      placeholder="Detailed description of the item"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      rows={2}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Specifications Section */}
              {item.specifications && item.specifications.length > 0 && (
                <>
                  <Divider
                    orientation="left"
                    style={styles.specificationDivider}
                  >
                    Specifications
                  </Divider>
                  {item.specifications.map((spec, specIndex) => (
                    <Row
                      key={spec.key}
                      gutter={16}
                      style={styles.specificationRow}
                      align="middle"
                    >
                      <Col xs={24} sm={10}>
                        <Input
                          placeholder="Specification Name (e.g., Color)"
                          value={spec.name}
                          onChange={(e) =>
                            updateSpecification(
                              item.id,
                              spec.key,
                              "name",
                              e.target.value
                            )
                          }
                          style={styles.formField}
                        />
                      </Col>
                      <Col xs={24} sm={10}>
                        <Input
                          placeholder="Specification Value (e.g., Blue)"
                          value={spec.value}
                          onChange={(e) =>
                            updateSpecification(
                              item.id,
                              spec.key,
                              "value",
                              e.target.value
                            )
                          }
                          style={styles.formField}
                        />
                      </Col>
                      <Col xs={24} sm={4}>
                        <Space>
                          {item.specifications.length > 1 && (
                            <Tooltip title="Remove Specification">
                              <Button
                                icon={<MinusCircleOutlined />}
                                onClick={() =>
                                  removeSpecification(item.id, spec.key)
                                }
                                type="text"
                                danger
                                style={styles.deleteButton}
                              />
                            </Tooltip>
                          )}
                          {/* Add new specification button only on the last spec row */}
                          {specIndex === item.specifications.length - 1 && (
                            <Tooltip title="Add New Specification">
                              <Button
                                icon={<PlusOutlined />}
                                onClick={() => addSpecification(item.id)}
                                type="dashed"
                                style={styles.addButton}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
              {/* Button to add first specification if none exist or last one is filled */}
              {(!item.specifications ||
                item.specifications.length === 0 ||
                (item.specifications.length > 0 &&
                  item.specifications[item.specifications.length - 1].name &&
                  item.specifications[item.specifications.length - 1]
                    .value)) && (
                <Button
                  onClick={() => addSpecification(item.id)}
                  block
                  type="dashed"
                  style={styles.addSpecButton}
                >
                  + Add Specification
                </Button>
              )}
            </Card>
          );
        })}
        {/* Button to add another item row */}
        <Button
          onClick={addItem}
          block
          type="dashed"
          style={styles.addItemButton}
        >
          + Add Another Item
        </Button>

        {/* Summary Section */}
        <Divider style={styles.divider}>Summary</Divider>
        <Col xs={24} md={12}>
          <Form.Item
            name="gstType"
            label="GST Type"
            rules={[{ required: true, message: "Please select a GST type!" }]}
          >
            <Select
              placeholder="Select GST calculation type"
              onChange={(value) => setGstType(value)}
              value={gstType}
              style={styles.formField}
            >
              <Option value="interstate">
                Interstate - IGST (Integrated GST)
              </Option>
              <Option value="intrastate">
                Intrastate - SGST/CGST (State/Central GST)
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Row gutter={[16, 16]} style={styles.summaryRow}>
          <Col xs={24} sm={8}>
            <Form.Item label="Sub Total">
              <Input
                readOnly
                value={`₹${calculateSubTotal().toFixed(2)}`}
                style={styles.totalField}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="GST Rate (%)">
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                value={taxRate}
                onChange={setTaxRate}
                style={styles.formField}
              />
            </Form.Item>
          </Col>
          {gstType === "interstate" && (
            <Col xs={24} sm={8}>
              <Form.Item label="IGST Amount">
                <Input
                  readOnly
                  value={`₹${calculateIGST().toFixed(2)}`}
                  style={styles.totalField}
                />
              </Form.Item>
            </Col>
          )}
          {gstType === "intrastate" && (
            <>
              <Col xs={24} sm={8}>
                <Form.Item label="CGST Amount">
                  <Input
                    readOnly
                    value={`₹${calculateCGST().toFixed(2)}`}
                    style={styles.totalField}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="SGST Amount">
                  <Input
                    readOnly
                    value={`₹${calculateSGST().toFixed(2)}`}
                    style={styles.totalField}
                  />
                </Form.Item>
              </Col>
            </>
          )}
          <Col xs={24} sm={8}>
            <Form.Item label="Grand Total">
              <Input
                readOnly
                value={`₹${calculateGrandTotal().toFixed(2)}`}
                style={styles.grandTotalField}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Payment Status and History */}
        <Form.Item label="Payment Status" name="paymentStatus">
          <Radio.Group
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <Radio.Button value="pending">Pending</Radio.Button>
            <Radio.Button value="partial">Partial</Radio.Button>
            <Radio.Button value="paid">Paid</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Divider>Payment History</Divider>
        {initialValues?.paymentHistory?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {initialValues.paymentHistory.map((p, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8 }}>
                <p>
                  <strong>Amount:</strong> ₹{p.amount}
                </p>
                <p>
                  <strong>Method:</strong> {p.method}
                </p>
                <p>
                  <strong>Date:</strong> {p.date}
                </p>
                <p>
                  <strong>Reference:</strong> {p.reference}
                </p>
                <p>
                  <strong>Added By:</strong> {p.addedBy}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Payment Entry */}
        <Divider>Add Payment Entry</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Amount" name="newPaymentAmount">
              <InputNumber min={0} style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Method" name="newPaymentMethod">
              <Select placeholder="Select method" style={styles.formField}>
                <Option value="Cash">Cash</Option>
                <Option value="Bank">Bank</Option>
                <Option value="UPI">UPI</Option>
                <Option value="Cheque">Cheque</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Reference" name="newPaymentReference">
              <Input style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Date" name="newPaymentDate">
              <DatePicker style={styles.formField} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Form.Item style={styles.buttonGroup}>
          <Space size="middle">
            <Button onClick={onCancel} size="large" disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="primary"
               style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={isSaving}
            >
              {initialValues ? "Update Invoice" : "Save Invoice"}
            </Button>
            <Button
              icon={<PrinterOutlined />}
              size="large"
              onClick={handlePrintInvoice}
            >
              Print
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InvoiceForm;
